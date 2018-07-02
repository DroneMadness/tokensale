# Drone Madness Token and Sale contracts

This projects defines several contracts related to the token sale of the Drone Madness token.
The token is standard `ERC20` `Ethereum` based and is written in `Solidity`. 
`Truffle framework` is used for contract development and deployment. 
All contracts depend on the `OpenZeppelin` framework.

## About

### Drone Madness is a platform for drone racing.
* See [DroneMadness.eu](https://dronemadness.eu) for more details.

## Token Details

### Token

| Field            | Value          |
|------------------|----------------|
| Token name       | DroneMadness   |
| Token Ticker     | DRNMD          |
| Decimals         | 18             |
| Total supply     | 4,000,000      |
| Token Sale       | 60%            |
| Team             | 10% Locked(6m) |
| Prizes Pool      | 10%            |
| Advisors         | 10%            |
| Airdrop & Bounty | 5%             |
| Reserve          | 5% Locked(1y)  |

### Pre-sale

| Field              	| Value                      	|
|-----------------------|-------------------------------|
| Supply             	| 2,400,000 DRNMD               |
| Rate               	| 750 DRNMD / 1 ETH             |
| Minimum investment   	| 0.1 ETH                      	|
| Whitelist         	| Yes                        	|
| Start date         	| 1 August, 2018 09:00 GMT  	|
| End date           	| 31 August, 2018 09:00 GMT 	|


Additional information:

- Rate - how many tokens for 1 ETH (Final rate will be set on 2nd of January 2018)
- Supply - max cap of tokens for pre-sale. Token is mintable. Unsold tokens will not be produced.
- "Whitelist - Yes" means that whitelist is enable and only whitelisted accounts can participate in the Pre-sale.

### Crowdsale

Parameters

| Field              	| Value                      	|
|-----------------------|-------------------------------|
| Hard Cap             	| 3,600 ETH                     |
| Soft Cap             	| 250 ETH                       |
| Rate                  | `See the table below`         |
| Individual cap       	| 100 ETH                      	|
| Minimum investment   	| 0.1 ETH                      	|
| Allow Modifying       | Yes							|
| Whitelist/KYC         | Yes                           |
| Start date         	| 1 September, 2018 09:00 GMT  	|
| End date           	| 31 December, 2018 09:00 GMT 	|

Bonus

| Timeframe             | Bonus |
|-----------------------|--------------------------|
| 1-30 September        | 30% or 650 DRNMD / 1 ETH |
| 1-31 October          | 20% or 600 DRNMD / 1 ETH |
| 1-30 Nomvember        | 10% or 550 DRNMD / 1 ETH |
| 1-31 December         |  0% or 500 DRNMD / 1 ETH |


Additional information:

- Rate - how many tokens for 1 ETH
- Supply - max cap of tokens for Crowdsale. Token is mintable. Unsold tokens will not be produced.
- "Whitelist - Yes" means that whitelist is enable and only whitelisted accounts can participate in the Crowdsale.

## Deployed contracts (Source code + verified)

* [DroneMadness Token](https://etherscan.io/token/)
* [DroneMadness Presale](https://etherscan.io/address/)
* [DroneMadness Crowdsale](https://etherscan.io/address/)


## Development

The smart contracts are implemented in Solidity `0.4.24` using `Truffle` and `OpenZeppelin` frameworks.

### Prerequisites

* [NodeJS](htps://nodejs.org), version 9+
* [truffle](http://truffleframework.com/), which is a comprehensive framework for Ethereum development. `npm install -g truffle` — this should install Truffle v4.1.11 or better.  Check that with `truffle version`.

### Initialisation

    npm install

#### From within Truffle

Run the `truffle` development environment

    truffle develop

then from the prompt you can run

    compile
    migrate
    test

as well as other truffle commands. See [truffleframework.com](http://truffleframework.com) for more.

#### Standalone

Start test network (ganache)

    npm run ganache

Run tests
*Because the tests manipulate the EVM you you need to restart ganache after every test and run each test individually.*

    npm run test:token
    npm run test:presale
    npm run test:sale

### Deploying to `ropsten`

You'll need an address on the Ropsten blockchain with some ETH in it.

Use [MetaMask](https://metamask.io) to create a wallet and use [faucet.metamask.io](https://faucet.metamask.io/) to get some ETH for it.

You will need to supply a file called `mnemonic` in the root of the project.

    the sequence of twelve words you used to keep your wallet secure

Then run

    npm run deploy:ropsten

