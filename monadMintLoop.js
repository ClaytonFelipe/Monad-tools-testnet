import 'dotenv/config';
import Web3 from 'web3';
import chalk from 'chalk'

const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';
const web3 = new Web3(MONAD_TESTNET_RPC);
const PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY;
const GAS_PRICE = web3.utils.toWei(process.env.GAS_PRICE || '52', 'gwei'); // Gas price baixo e fixo

// Array de contratos com seus endereços e preços
const CONTRACTS = [
  { address: process.env.CONTRACT_ADDRESS_1, mintPrice: web3.utils.toWei(process.env.MINT_PRICE_1 || '0.0', 'ether') },
  { address: process.env.CONTRACT_ADDRESS_2, mintPrice: web3.utils.toWei(process.env.MINT_PRICE_2 || '0.0', 'ether') },
  { address: process.env.CONTRACT_ADDRESS_3, mintPrice: web3.utils.toWei(process.env.MINT_PRICE_3 || '0.0', 'ether') },
  { address: process.env.CONTRACT_ADDRESS_4, mintPrice: web3.utils.toWei(process.env.MINT_PRICE_4 || '0.01', 'ether') },
  // Adicione mais contratos conforme necessário
];

const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
const walletAddress = account.address;

async function checkBalance() {
  const balance = await web3.eth.getBalance(walletAddress);
  console.log(`Saldo atual: ${web3.utils.fromWei(balance, 'ether')} MONAD`);
  return balance;
}

async function verifyMint(txHash, expectedQuantity) {
  const txReceipt = await web3.eth.getTransactionReceipt(txHash);
  const transferSingleSig = web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)');
  
  for (const log of txReceipt.logs) {
    if (log.topics[0] === transferSingleSig) {
      const decodedData = web3.eth.abi.decodeParameters(['uint256', 'uint256'], log.data);
      const tokenId = decodedData[0];
      const amount = decodedData[1];
      console.log(`Evento TransferSingle detectado: tokenId=${tokenId}, amount=${amount}`);
      return Number(amount) === expectedQuantity;
    }
  }
  console.log('Nenhum evento TransferSingle encontrado');
  return false;
}

async function mintERC1155Token(contractIndex, quantity = 1) {
  const startTime = Date.now();
  const contract = CONTRACTS[contractIndex];
  
  try {
    const tokenId = 0;
    const mintPriceTotal = BigInt(contract.mintPrice) * BigInt(quantity);
    const balance = await checkBalance();

    if (BigInt(balance) < mintPriceTotal) {
      console.error('Saldo insuficiente para mintar', quantity, 'NFTs no contrato', contract.address);
      return false;
    }

    const methodSignature = '0x9b4f3af5';
    const addressHex = walletAddress.slice(2).padStart(64, '0');
    const tokenIdHex = '0000000000000000000000000000000000000000000000000000000000000000';
    const amountHex = web3.utils.toHex(quantity).slice(2).padStart(64, '0');
    const dataOffset = web3.utils.toHex(128).slice(2).padStart(64, '0');
    const dataLength = '0000000000000000000000000000000000000000000000000000000000000000';
    const txData = methodSignature + addressHex + tokenIdHex + amountHex + dataOffset + dataLength;

    const gasEstimate = await web3.eth.estimateGas({
      from: walletAddress,
      to: contract.address,
      value: mintPriceTotal,
      data: txData
    });

    console.log('Enviando transação para mintar', quantity, 'NFTs no contrato', contract.address);
    const tx = await web3.eth.sendTransaction({
      from: walletAddress,
      to: contract.address,
      value: mintPriceTotal,
      gas: gasEstimate,           // Usando o gas estimado diretamente, sem multiplicador
      gasPrice: GAS_PRICE,        // Gas price fixo e baixo
      data: txData
    });

    console.log(chalk.green(`Mint realizado! Hash: ${tx.transactionHash}`));
    
    const isCorrect = await verifyMint(tx.transactionHash, quantity);
    console.log(`Quantidade mintada correta? ${isCorrect ? 'Sim' : 'Não'}`);
    
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSec = (durationMs / 1000).toFixed(3);
    console.log(`Tempo de execução: ${chalk.yellow(durationMs + "ms")} (${chalk.yellow(durationSec + "s")})`);
    
    return true;
  } catch (error) {
    console.error('Erro ao mintar:', error.message);
    return false;
  }
}

async function runMintLoop({
  intervalBetweenContracts = 5000, // Intervalo entre mints de diferentes contratos (ms)
  totalLoops = 100,              // Número total de loops
  quantityPerMint = 1            // Quantidade por mint
}) {
  console.log('Iniciando bot de mint para múltiplos contratos...');
  await checkBalance();

  let currentLoop = 0;

  const mintLoop = async () => {
    while (currentLoop < totalLoops) {
      console.log(`\nLoop ${currentLoop + 1} de ${totalLoops}`);
      
      for (let i = 0; i < CONTRACTS.length; i++) {
        console.log(`Mintando contrato ${i + 1}/${CONTRACTS.length}`);
        const success = await mintERC1155Token(i, quantityPerMint);
        
        if (!success) {
          console.log(chalk.red('Falha no mint, continuando para próximo contrato'));
        }

        if (i < CONTRACTS.length - 1) {
          console.log(`Aguardando ${intervalBetweenContracts/1000}s antes do próximo contrato...`);
          await new Promise(resolve => setTimeout(resolve, intervalBetweenContracts));
        }
      }
      
      currentLoop++;
      if (currentLoop < totalLoops) {
        console.log('Loop concluído, iniciando próximo loop...');
      }
    }
    
    console.log(chalk.green('Todos os loops concluídos!'));
  };

  await mintLoop();
}

async function startBot() {
  await runMintLoop({
    intervalBetweenContracts: 4000, // 5 segundos entre contratos
    totalLoops: 100,               // 100 loops
    quantityPerMint: 1             // 1 NFT por mint
  });
}

startBot();