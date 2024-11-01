// SPDX-License-Identifier: MIT
pragma solidity >=0.5.8 <0.9.0;

/// @title An escrow contract with a third-party agent for USDC
/// @notice This contract holds USDC tokens from a depositor and keeps it until the third-party agent decides to send the tokens to the beneficiary
interface USDC {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract EscrowWithAgent {
    address public factoryAddress;
    address public depositor;
    address public beneficiary;
    address public agent;
    uint256 public amount;
    USDC public usdcToken;
    Stages public currentStage;

    event deposited(uint256 amount, Stages currentStage);
    event released(uint256 amount, Stages currentStage);
    event reverted(uint256 amount, Stages currentStage);
    event stageChange(Stages currentStage);

    enum Stages {
        OPEN,
        LOCKED,
        CLOSED
    }

    // Constructor to set the factory address
    constructor(address _factoryAddress) {
        factoryAddress = _factoryAddress;
    }

    function init(
        address _depositor,
        address _beneficiary,
        address _agent,
        uint256 _amount,
        address _usdcTokenAddress
    ) public {
        require(msg.sender == factoryAddress, "Only factory can initialize"); // ensure only the factory contract can call this function
        require(currentStage == Stages(0), "Already initialized"); // ensure it's only called once
        depositor = _depositor;
        beneficiary = _beneficiary;
        agent = _agent;
        amount = _amount;
        usdcToken = USDC(_usdcTokenAddress);
        currentStage = Stages.OPEN;
        emit stageChange(currentStage);
    }

    function deposit() public {
        require(msg.sender == depositor, "Sender must be the depositor");
        require(currentStage == Stages.OPEN, "Wrong stage");
        require(
            usdcToken.balanceOf(address(this)) <= amount,
            "Can't send more than specified amount"
        );

        usdcToken.transferFrom(depositor, address(this), amount);

        if (usdcToken.balanceOf(address(this)) >= amount) {
            currentStage = Stages.LOCKED;
            emit stageChange(currentStage);
        }
        emit deposited(amount, currentStage);
    }

    function release() public {
        require(msg.sender == agent, "Only agent can release funds");
        require(currentStage == Stages.LOCKED, "Funds not in escrow yet");
        usdcToken.transfer(beneficiary, amount);
        currentStage = Stages.CLOSED;
        emit stageChange(currentStage);
        emit released(amount, currentStage);
    }

    function revertEscrow() public {
        require(msg.sender == agent, "Only agent can revert the contract");
        require(
            currentStage == Stages.LOCKED || currentStage == Stages.OPEN,
            "Cannot revert at this stage"
        );
        usdcToken.transfer(depositor, amount);
        currentStage = Stages.CLOSED;
        emit stageChange(currentStage);
        emit reverted(amount, currentStage);
    }

    function stageOf() public view returns (Stages) {
        return currentStage;
    }

    function balanceOf() public view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
}

/// @title Escrow Factory Contract with Unique ID for Each Escrow
/// @notice This contract creates and manages multiple EscrowWithAgent contracts and assigns a unique ID to each escrow
contract EscrowFactory {
    uint256 public escrowCounter; // counter for unique escrow IDs
    struct EscrowDetails {
        address escrowAddress;
        address depositor;
        address beneficiary;
        address agent;
        uint256 amount;
        uint256 escrowId;
    }

    mapping(uint256 => EscrowDetails) public escrowsById; // mapping to store escrows by their unique ID
    event EscrowCreated(
        uint256 escrowId,
        address escrowAddress,
        address depositor,
        address beneficiary,
        address agent,
        uint256 amount
    );

    function createEscrow(
        address _depositor,
        address _beneficiary,
        address _agent,
        uint256 _amount,
        address _usdcTokenAddress
    ) public returns (uint256) {
        EscrowWithAgent newEscrow = new EscrowWithAgent(address(this));
        newEscrow.init(
            _depositor,
            _beneficiary,
            _agent,
            _amount,
            _usdcTokenAddress
        );

        // Increment the counter to get a new unique ID
        escrowCounter++;
        uint256 newEscrowId = escrowCounter;

        // Store the details of the new escrow in the mapping
        escrowsById[newEscrowId] = EscrowDetails({
            escrowAddress: address(newEscrow),
            depositor: _depositor,
            beneficiary: _beneficiary,
            agent: _agent,
            amount: _amount,
            escrowId: newEscrowId
        });

        emit EscrowCreated(
            newEscrowId,
            address(newEscrow),
            _depositor,
            _beneficiary,
            _agent,
            _amount
        );
        return newEscrowId;
    }

    // Function to retrieve escrow details by ID
    function getEscrowById(
        uint256 _escrowId
    ) public view returns (EscrowDetails memory) {
        return escrowsById[_escrowId];
    }
}