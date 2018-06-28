pragma solidity ^0.4.24;

import "./zeppelin/token/ERC20/CappedToken.sol";
import "./zeppelin/token/ERC20/PausableToken.sol";

/**
 * @title Drone Madness Token
 * @dev Drone Madness Token - Token code for the Drone Madness Project
 *
 * Add details ...
 */
contract DroneMadnessToken is CappedToken, PausableToken {

    string public constant name                 = "Drone Madness Token";
    string public constant symbol               = "DRNMD";
    uint public constant decimals               = 18;

    constructor(uint256 _totalSupply) 
        CappedToken(_totalSupply) public {
        paused = true;
    }
}