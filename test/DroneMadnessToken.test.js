const assertThrows = require("./utils/assertThrows.js");
const DroneMadnessToken = artifacts.require('./DroneMadnessToken.sol')

let settings = require('../tokenSettings.json');

contract('DroneMadnessToken', function(accounts) {

    const [
        owner,
        user1,
        user2,
        user3,
        user4,
        user5
    ] = accounts;

    describe("Initial settings", function() {

        it ('should be possible to create a new DroneMadnessToken ("DRNMD") token', async() => { 
            token = await DroneMadnessToken.new(settings.maxTokenSupply);
            assert.isNotNull(token);
        })

        it ('should have the correct token settings', async() => { 
            var name = await token.name();
            assert.strictEqual(name, settings.name);
            var symbol = await token.symbol();
            assert.strictEqual(symbol, settings.symbol);
            var decimals = await token.decimals();
            assert.strictEqual(decimals.toNumber(), settings.decimals);            
            var cap = await token.cap();
            assert.strictEqual(cap.toNumber(), settings.maxTokenSupply);
        })

        it ('should be in paused and non-transfer mode', async() => { 
            
            var paused = await token.paused();
            assert.strictEqual(true, paused);
        })
    })
    
    describe("State transfers", function() {

        it ('should NOT be possible to pause if it is already paused', async() => { 
            await assertThrows(token.pause());

            var paused = await token.paused();
            assert.strictEqual(true, paused);
        })
        
        it ('should NOT be possible for anyone besides the owner to unpause', async() => { 
            await assertThrows(token.unpause({from : user1}));
        })

        it ('should be possible to unpause if it is in paused', async() => { 
            var tx = await token.unpause();

            assert.strictEqual("Unpause", tx.logs[0].event);
            var paused = await token.paused();
            assert.strictEqual(false, paused);
        })

        it ('should NOT be possible for anyone besides the owner to pause', async() => { 
            await assertThrows(token.pause({from : user1}));
        })

        it ('should be possible to pause again if it un-paused', async() => { 
            var tx = await token.pause();

            assert.strictEqual("Pause", tx.logs[0].event);
            var paused = await token.paused();
            assert.strictEqual(true, paused);
        })
    })

    describe("Funding", function() {

        it ('should be possible for the owner to mint new tokens', async() => { 
            const balanceBefore = (await token.balanceOf(user5)).toNumber();
            token.mint(user5, 1000, {from : owner});
            const balanceAfter = (await token.balanceOf(user5)).toNumber();
            assert.strictEqual(balanceAfter, balanceBefore + 1000);
        })

        it ('should NOT be possible for anyone besides the owner to mint new tokens', async() => { 
            await assertThrows(token.mint(user1, 1000, {from : user1}));
        })
    })
})