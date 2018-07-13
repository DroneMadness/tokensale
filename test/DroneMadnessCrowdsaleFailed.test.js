const assertThrows = require("./utils/assertThrows.js");
const timeTravel = require("./utils/timeTravel.js");
const RefundVault = artifacts.require("./zeppelin/crowdsale/distribution/utils/RefundVault.sol");
const TokenPool = artifacts.require('./TokenPool.sol')
const TokenTimelock = artifacts.require('./zeppelin/token/ERC20/TokenTimelock.sol')
const DroneMadnessToken = artifacts.require('./DroneMadnessToken.sol')
const DroneMadnessCrowdsale = artifacts.require('./DroneMadnessCrowdsale.sol')

let settings = require('../tokenSettings.json');

contract('DroneMadnessCrowdsale', function(accounts) {

    const [
        owner,
        user1,
        user2,
        whitelistedUser,
        notlistedUser,
        advisor1,
        advisor2,
        airdrop1,
        airdrop2
    ] = accounts;

    let token;
    let sale;
    let currentTime = Math.floor(Date.now() / 1000);
    
    describe("Deployment", function() {

        it ('should be possible to create a new Crowdsale contract', async() => { 

            token = await DroneMadnessToken.new(settings.maxTokenSupply);
            assert.isNotNull(token);

            sale = await DroneMadnessCrowdsale.new(
                settings.crowdsaleCap, 
                settings.crowdsaleGoal, 
                settings.crowdsaleOpeningTime, 
                settings.crowdsaleClosingTime, 
                settings.crowdsaleRate, 
                settings.crowdsaleMinInvestmentInWei,
                settings.crowdsaleMaxInvestmentInWei,
                settings.fundWallet, 
                token.address);
            assert.isNotNull(sale);

            // Transfer token ownership to the sale
            let tx = await token.transferOwnership(sale.address);
            let newOwner = await token.owner();
            assert.strictEqual('OwnershipTransferred', tx.logs[0].event);
            assert.strictEqual(newOwner, sale.address);

            // Perform initial distribution
            await sale.doInitialDistribution(
                settings.teamWallet,
                settings.prizePool,
                settings.reservePool
            );
        })
   })
    
    describe("Whitelist", function() {

        it ('should be possible to add a single address to the whitelist', async() => { 
            let whitelisted = await sale.whitelist(whitelistedUser);
            assert.isFalse(whitelisted);
            await sale.addToWhitelist(whitelistedUser);
            whitelisted = await sale.whitelist(whitelistedUser);
            assert.isTrue(whitelisted);
        })    
    })
    
    describe("Funding", function() { 

        it ('should be possible whitelisted user to purchase tokens during crowdsale', async() => { 

            // Time travel to the crowdsale start
            let travelSeconds = settings.crowdsaleOpeningTime - currentTime;
            timeTravel(travelSeconds);
            currentTime += travelSeconds;

            let amount = (await sale.minInvestmentInWei()).toNumber();
            let rate = (await sale.rate()).toNumber();
            let tokensAmount = amount * rate;

            let balanceBefore = (await token.balanceOf(whitelistedUser)).toNumber();
            await sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000});
            let balanceAfter = (await token.balanceOf(whitelistedUser)).toNumber();
            assert.equal(balanceAfter, balanceBefore + tokensAmount);
        })
    })

    describe("Stages & Finalization", function() { 

        it ('should be possible to finalize after the closing date with no goal reached', async() => { 
            // Time travel to the crowdsale end
            let travelSeconds = settings.crowdsaleClosingTime - currentTime;
            timeTravel(travelSeconds);
            currentTime += travelSeconds;

            let goalReached = await sale.goalReached();
            assert.isFalse(goalReached);

            let ownerBalanceBefore = (await web3.eth.getBalance(settings.fundWallet)).toNumber();

            // Finalize
            await sale.finalize({from: owner});

            // Check if minting has finished
            let mintingFinished = await token.mintingFinished();
            assert.isTrue(mintingFinished);

            // Check if token is unpaused
            let paused = await token.paused();
            assert.isFalse(paused);

            // Check if the ownership is transferred back to the original owner
            let newOwner = await token.owner();
            assert.strictEqual(owner, newOwner);

            // Check if the funds are NOT transferred from the RefundVault to the wallet
            let ownerBalanceAfter = (await web3.eth.getBalance(settings.fundWallet)).toNumber();
            assert.strictEqual(ownerBalanceAfter, ownerBalanceBefore);

            let vaultAddress = await sale.vault();
            let vault = RefundVault.at(vaultAddress);
            vaultState = await vault.state();
            // Assert the vault is in Refunding state
            assert.strictEqual(vaultState.toNumber(), 1);
        })

        it ('should be possible to a participant to refund his money', async() => { 
            let balanceBefore = (await web3.eth.getBalance(whitelistedUser)).toNumber();
            await sale.claimRefund({from: whitelistedUser});
            let balanceAfter = (await web3.eth.getBalance(whitelistedUser)).toNumber();
            assert.isAbove(balanceAfter, balanceBefore);
        })

        it ('should be possible to transfer funds after the crowdsale end', async() => { 
            let balanceSource = (await token.balanceOf(whitelistedUser)).toNumber();
            let balanceBefore = (await token.balanceOf(user1)).toNumber();
            await token.transfer(user1, balanceSource, {from: whitelistedUser});
            let balanceAfter = (await token.balanceOf(user1)).toNumber();
            assert.strictEqual(balanceAfter, balanceBefore + balanceSource);
        })

        it ('should be possible to perform airdrops after the crowdsale end', async() => { 
            let paused = await token.paused();
            assert.isFalse(paused);

            let airdropPoolAddress = await sale.airdropPool();
            let airdropPool = TokenPool.at(airdropPoolAddress);

            let amount = Number(web3.toWei(100, 'ether'));
            let balanceBefore1 = (await token.balanceOf(airdrop1)).toNumber();
            let balanceBefore2 = (await token.balanceOf(airdrop2)).toNumber();

            await airdropPool.allocateEqual([airdrop1, airdrop2], amount);

            let balanceAfter1 = (await token.balanceOf(airdrop1)).toNumber();
            let balanceAfter2 = (await token.balanceOf(airdrop2)).toNumber();

            assert.equal(balanceAfter1, balanceBefore1 + amount);
            assert.equal(balanceAfter2, balanceBefore2 + amount);
        })
    })
})
