const fs = require('fs');
const path = require('path');
const _ = require('lodash');

function processarArquivoSRT(filePath: string): string[] {
  const data = fs.readFileSync(filePath, 'utf8');
  const linhas = data.split('\n');

  let legendas: string[] = [];
  let emLegenda = false;

  for (const linha of linhas) {
    if (linha.trim() === '') {
      emLegenda = false;
    } else if (!emLegenda && /^\d+$/.test(linha.trim())) {
      emLegenda = true;
    } else if (emLegenda) {
      legendas.push(linha.trim());
    }
  }

  return legendas;
}

function contarPalavras(legendas: string[]): Map<string, number> {
  const contagemPalavras = new Map<string, number>();

  for (const legenda of legendas) {
    const palavras = legenda
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, '') 
      .split(/\s+/)
      .filter((palavra) => palavra !== '');

    for (const palavra of palavras) {
      const contagem = contagemPalavras.get(palavra) || 0;
      contagemPalavras.set(palavra, contagem + 1);
    }
  }

  return contagemPalavras;
}

function gerarArquivoFrequenciaJSON(contagemPalavras: Map<string, number>, outputPath: string): void {
  const contagemOrdenada = [...contagemPalavras.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([palavra, frequencia]) => ({ palavra, frequencia }));

  fs.writeFileSync(outputPath, JSON.stringify(contagemOrdenada, null, 2));
}

const diretorioEntrada = '../vikings-first-season';
const diretorioSaida = './resultados';

fs.readdirSync(diretorioEntrada)
  .filter((arquivo: string) => arquivo.endsWith('.srt'))
  .forEach((arquivo: string) => {
    const filePath = path.join(diretorioEntrada, arquivo);
    const legendas = processarArquivoSRT(filePath);
    const contagemPalavras = contarPalavras(legendas);
    const nomeArquivoSaida = `episodio-${path.parse(arquivo).name}.json`;
    const outputPath = path.join(diretorioSaida, nomeArquivoSaida);

    gerarArquivoFrequenciaJSON(contagemPalavras, outputPath);
  });

const contagemTodasPalavras = new Map<string, number>();
fs.readdirSync(diretorioSaida)
  .filter((arquivo: string) => arquivo.endsWith('.json'))
  .forEach((arquivo: string) => {
    const filePath = path.join(diretorioSaida, arquivo);
    const contagemPalavras = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { palavra: string; frequencia: number }[];
    
    for (const { palavra, frequencia } of contagemPalavras) {
      const contagem = contagemTodasPalavras.get(palavra) || 0;
      contagemTodasPalavras.set(palavra, contagem + frequencia);
    }
  });

gerarArquivoFrequenciaJSON(contagemTodasPalavras, path.join(diretorioSaida, `temporada-${path.basename(diretorioEntrada)}.json`));
