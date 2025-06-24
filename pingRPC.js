import { Web3 } from 'web3';
import chalk from 'chalk';

const RPCS = [
    { name: "Básico", url: "https://testnet-rpc.monad.xyz" },
    { name: "QuickNode", url: ""},
    { name: "Alchemy", url: ""}
];

async function getRpcPing(rpc) {
    try {
        const web3 = new Web3(rpc.url);
        const startTime = Date.now();
        
        await web3.eth.getBlockNumber(); // Faz uma requisição simples

        const ping = Date.now() - startTime;
        console.log(`✅ ${chalk.blue(rpc.name)}: ${chalk.yellow(ping + "ms")}`);
        return { name: rpc.name, url: rpc.url, ping };
    } catch (error) {
        console.error(`❌ ${chalk.red(rpc.name)}: Erro ao conectar (${error.message})`);
        return { name: rpc.name, url: rpc.url, ping: null };
    }
}

async function findFastestRpc() {
    console.log("\n🔍 Testando RPCs...\n");

    const results = await Promise.all(RPCS.map(getRpcPing));

    // Filtra os RPCs válidos e encontra o mais rápido
    const validResults = results.filter(rpc => rpc.ping !== null);
    if (validResults.length === 0) {
        console.log(chalk.red("❌ Nenhum RPC disponível!"));
        return null;
    }

    const fastest = validResults.reduce((best, current) => (current.ping < best.ping ? current : best));

    console.log(`\n🚀 RPC mais rápido: ${chalk.green(fastest.name)} (${chalk.yellow(fastest.ping + "ms")})`);
    return fastest.url;
}

// Executar o teste
findFastestRpc();
