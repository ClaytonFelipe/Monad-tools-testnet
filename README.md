<p align="center">
  <img src="https://img.notionusercontent.com/s3/prod-files-secure%2F8b536fe4-3bbf-45fc-b661-190b80c94bea%2F29d17d5b-79f0-4fde-bade-1e40bf487245%2FMonad_Logo_-_Default_-_Horizontal_Logo.png/size/w=2000?exp=1750877204&sig=QcOHEnNhAR7y4g_arHpW_oKiiGI-sgs8N0Oy580RXW0&id=16863675-94f2-80d0-9f96-ff62dd702800&table=block" width="120" alt="Logo"/>
</p>

<h1 align="center">Monad Tool Testnet</h1>

<p align="center">
  🧪 Ferramentas automatizadas para testes na testnet da Monad, com suporte a staking, mint de NFTs e comparação de RPCs.
</p>

---

## 📁 Estrutura do Projeto

- `monadGmon.js` – Executa um loop automático de **stake/unstake** no contrato da MagmaStaking.
- `monadMintLoop.js` – Realiza um **loop de mint de NFTs** na Magic Eden com múltiplos contratos.
- `pingRPC.js` – Compara várias URLs de **RPC** e identifica a mais rápida para uso.

---

## ⚙️ Configuração do `.env`

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
MONAD_PRIVATE_KEY="sua_chave_privada"

# Endereços dos contratos de mint (Magic Eden)
CONTRACT_ADDRESS_1=""
CONTRACT_ADDRESS_2=""
CONTRACT_ADDRESS_3=""
CONTRACT_ADDRESS_4=""

# Endereço do contrato GMON (staking)
GMON_CONTRACT_ADDRESS=""

# Preços de mint (em tokens)
MINT_PRICE_1=0.0
MINT_PRICE_2=0.0
MINT_PRICE_3=0.0
MINT_PRICE_4=0.01

# Preço do GAS em gwei
GAS_PRICE=52
```
