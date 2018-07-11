pragma solidity ^0.4.24;

import "./zeppelin/math/SafeMath.sol";
import "./zeppelin/ownership/Ownable.sol";
import "./zeppelin/token/ERC20/ERC20Basic.sol";
import "./zeppelin/token/ERC20/SafeERC20.sol";

/**
 * @title TokenPool 
 * @dev Token Pool contract used to store tokens for special purposes
 * The pool can receive tokens and can transfer tokens to multiple beneficiaries.
 * It can be used for airdrops or similar cases.
 */
contract TokenPool is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

    ERC20Basic public token;
    uint256 public cap;
    uint256 public totalAllocated;

    /**
     * @dev Contract constructor
     * @param _token address token that will be stored in the pool
     * @param _cap uint256 predefined cap of the pool
     */
    constructor(address _token, uint256 _cap) public {
        token = ERC20Basic(_token);
        cap = _cap;
        totalAllocated = 0;
    }

    /**
     * @dev Transfer different amounts of tokens to multiple beneficiaries 
     * @param _beneficiaries addresses of the beneficiaries
     * @param _amounts uint256[] amounts for each beneficiary
     */
    function allocate(address[] _beneficiaries, uint256[] _amounts) public onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i ++) {
            require(totalAllocated.add(_amounts[i]) <= cap);
            token.safeTransfer(_beneficiaries[i], _amounts[i]);
            totalAllocated.add(_amounts[i]);
        }
    }

    /**
     * @dev Transfer the same amount of tokens to multiple beneficiaries 
     * @param _beneficiaries addresses of the beneficiaries
     * @param _amounts uint256[] amounts for each beneficiary
     */
    function allocateEqual(address[] _beneficiaries, uint256 _amounts) public onlyOwner {
        uint256 totalAmount = _amounts.mul(_beneficiaries.length);
        require(totalAllocated.add(totalAmount) <= cap);
        require(token.balanceOf(this) >= totalAmount);

        for (uint256 i = 0; i < _beneficiaries.length; i ++) {
            token.safeTransfer(_beneficiaries[i], _amounts);
            totalAllocated.add(_amounts);
        }
    }
}