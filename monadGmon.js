import 'dotenv/config';

import Web3 from 'web3';
import chalk from 'chalk';

const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';
const web3 = new Web3(MONAD_TESTNET_RPC);
const PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY;
const CONTRACT_ADDRESS = '0x2c9C959516e9AAEdB2C748224a41249202ca8BE7'; // Endereço do contrato de staking (FIXO na testnet)
const GMON_CONTRACT_ADDRESS = process.env.GMON_CONTRACT_ADDRESS; // Endereço do contrato do gMON
const GAS_PRICE = web3.utils.toWei(process.env.GAS_PRICE || '52', 'gwei'); // Gas price baixo

// ABI mínima para o contrato ERC20 (gMON) - apenas para verificar saldo
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  }
];

const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
const walletAddress = account.address;

// Instância do contrato gMON (apenas para verificar saldo)
const gmonContract = new web3.eth.Contract(ERC20_ABI, GMON_CONTRACT_ADDRESS);

async function checkMONBalance() {
  const balance = await web3.eth.getBalance(walletAddress);
  console.log(`Saldo atual de MON: ${web3.utils.fromWei(balance, 'ether')} MON`);
  return balance;
}

async function checkGMONBalance() {
  const balance = await gmonContract.methods.balanceOf(walletAddress).call();
  console.log(`Saldo atual de gMON: ${web3.utils.fromWei(balance, 'ether')} gMON`);
  return balance;
}

async function stakeMON(amountToStake) {
  const startTime = Date.now();
  const amountInWei = web3.utils.toWei(amountToStake.toString(), 'ether');

  try {
    const balance = await checkMONBalance();
    if (BigInt(balance) < BigInt(amountInWei)) {
      console.error('Saldo insuficiente para stake de', amountToStake, 'MON');
      return false;
    }

    const txData = '0xd5575982';
    console.log(`Input Data para stake: ${txData}`);

    const gasEstimate = await web3.eth.estimateGas({
      from: walletAddress,
      to: CONTRACT_ADDRESS,
      value: amountInWei,
      data: txData
    });

    console.log(`Enviando transação para stake de ${amountToStake} MON...`);
    const tx = await web3.eth.sendTransaction({
      from: walletAddress,
      to: CONTRACT_ADDRESS,
      value: amountInWei,
      gas: gasEstimate,
      gasPrice: GAS_PRICE,
      data: txData
    });

    console.log(chalk.green(`Stake realizado! Hash: ${tx.transactionHash}`));
    
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSec = (durationMs / 1000).toFixed(3);
    console.log(`Tempo de execução: ${chalk.yellow(durationMs + "ms")} (${chalk.yellow(durationSec + "s")})`);
    
    return true;
  } catch (error) {
    console.error('Erro ao realizar stake:', error.message);
    return false;
  }
}

async function unstakeGMON(amountToUnstake) {
  const startTime = Date.now();
  const amountInWei = web3.utils.toWei(amountToUnstake.toString(), 'ether');

  try {
    // Verificar saldo de gMON
    const gmonBalance = await checkGMONBalance();
    if (BigInt(gmonBalance) < BigInt(amountInWei)) {
      console.error('Saldo insuficiente para unstake de', amountToUnstake, 'gMON');
      return false;
    }

    const methodSignature = '0x6fed1ea7';
    const amountHex = BigInt(amountInWei).toString(16).padStart(64, '0');
    const txData = methodSignature + amountHex;
    console.log(`Input Data para unstake: ${txData}`);

    // Simular a transação para capturar erros
    try {
      await web3.eth.call({
        from: walletAddress,
        to: CONTRACT_ADDRESS,
        value: 0,
        data: txData
      });
      console.log(chalk.green('Simulação do unstake bem-sucedida!'));
    } catch (simulationError) {
      console.error('Erro na simulação do unstake:', simulationError.message);
      return false;
    }

    const gasEstimate = await web3.eth.estimateGas({
      from: walletAddress,
      to: CONTRACT_ADDRESS,
      value: 0,
      data: txData
    });

    console.log(`Enviando transação para unstake de ${amountToUnstake} gMON...`);
    const tx = await web3.eth.sendTransaction({
      from: walletAddress,
      to: CONTRACT_ADDRESS,
      value: 0,
      gas: gasEstimate,
      gasPrice: GAS_PRICE,
      data: txData
    });

    console.log(chalk.green(`Unstake realizado! Hash: ${tx.transactionHash}`));
    
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSec = (durationMs / 1000).toFixed(3);
    console.log(`Tempo de execução: ${chalk.yellow(durationMs + "ms")} (${chalk.yellow(durationSec + "s")})`);
    
    return true;
  } catch (error) {
    console.error('Erro ao realizar unstake:', error.message);
    return false;
  }
}

async function runStakeUnstakeLoop({
  intervalBetweenActions = 5000,
  totalLoops = 100,
  amountPerAction = 1// Ajustado para 1 gMON, já que o saldo é 1 gMON
}) {
  console.log('Iniciando bot de stake/unstake...');
  await checkMONBalance();
  await checkGMONBalance();

  let currentLoop = 0;

  const loop = async () => {
    while (currentLoop < totalLoops) {
      console.log(`\nLoop ${currentLoop + 1} de ${totalLoops}`);

      // Stake
      console.log(`Realizando stake de ${amountPerAction} MON...`);
      const stakeSuccess = await stakeMON(amountPerAction);
      if (!stakeSuccess) {
        console.log(chalk.red('Falha no stake, continuando para unstake...'));
      }

      // Aguarda o intervalo antes do unstake
      console.log(`Aguardando ${intervalBetweenActions/1000}s antes do unstake...`);
      await new Promise(resolve => setTimeout(resolve, intervalBetweenActions));

      // Unstake
      console.log(`Realizando unstake de ${amountPerAction} gMON...`);
      const unstakeSuccess = await unstakeGMON(amountPerAction);
      if (!unstakeSuccess) {
        console.log(chalk.red('Falha no unstake, continuando para próximo loop...'));
      }

      currentLoop++;
      if (currentLoop < totalLoops) {
        console.log('Loop concluído, iniciando próximo loop...');
      }
    }

    console.log(chalk.green('Todos os loops concluídos!'));
  };

  await loop();
}

async function startBot() {
  await runStakeUnstakeLoop({
    intervalBetweenActions: 8000,
    totalLoops: 100,
    amountPerAction: 3 // Ajustado para 1 gMON
  });
}

startBot();