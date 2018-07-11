pragma solidity ^0.4.24;

import "./DroneMadnessToken.sol";
import "./zeppelin/lifecycle/Pausable.sol";
import "./zeppelin/crowdsale/emission/MintedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/WhitelistedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/TimedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/CappedCrowdsale.sol";
/**
 * @title Drone Madness Presale Contract
 * @dev Drone Madness Presale Contract
 * The contract is for the private sale of the Drone Madness token. It is:
 * - With a hard cap in ETH
 * - Limited in time (start/end date)
 * - Only for whitelisted participants to purchase tokens
 * - Tokens are minted on each purchase
 */
contract DroneMadnessPresale is 
    MintedCrowdsale,
    CappedCrowdsale,
    TimedCrowdsale,
    WhitelistedCrowdsale {
    using SafeMath for uint256;

    // Min investment
    uint256 public minInvestmentInWei;
    
    // Investments
    mapping (address => uint256) internal invested;

    /**
     * @dev Contract constructor
     * @param _cap uint256 hard cap of the crowdsale
     * @param _openingTime uint256 crowdsale start date/time
     * @param _closingTime uint256 crowdsale end date/time
     * @param _rate uint256 initial rate DRNMD for 1 ETH
     * @param _wallet address address where the collected funds will be transferred
     * @param _token DroneMadnessToken our token
     */
    constructor(
        uint256 _cap, 
        uint256 _openingTime, 
        uint256 _closingTime, 
        uint256 _rate, 
        uint256 _minInvestmentInWei,
        address _wallet, 
        DroneMadnessToken _token) 
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap)
        TimedCrowdsale(_openingTime, _closingTime) public {
        _minInvestmentInWei = minInvestmentInWei;
    }

    /**
    * @dev Validate min investment amount
    * @param _beneficiary address token purchaser
    * @param _weiAmount uint256 amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        require(_weiAmount >= minInvestmentInWei);
    }

    /**
    * @dev Transfer the ownership of the token conctract 
    * @param _newOwner address the new owner of the token
    */
    function transferTokenOwnership(address _newOwner) onlyOwner public { 
        Ownable(token).transferOwnership(_newOwner);
    }
}
