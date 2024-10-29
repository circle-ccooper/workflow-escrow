// SPDX-License-Identifier: MIT
pragma solidity >=0.5.8 <0.9.0;

/// @title An escrow contract with a third-party agent
/// @author Anthony Kelani
/// @notice This contract holds some tokens from a depositor and keeps it until the third-party agent decides to send the ether to the beneficiary
contract EscrowWithAgent {
    address payable public depositor;
    address payable public beneficiary;
    address public agent;
    uint256 public amount;
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

    function init(
        address payable _depositor,
        address payable _beneficiary,
        address _agent,
        uint256 _amount
    ) public {
        require(currentStage == Stages(0), "Already initialized"); // ensure it's only called once
        depositor = _depositor;
        beneficiary = _beneficiary;
        agent = _agent;
        amount = _amount;
        currentStage = Stages.OPEN;
        emit stageChange(currentStage);
    }

    function deposit() public payable {
        require(msg.sender == depositor, "Sender must be the depositor");
        require(currentStage == Stages.OPEN, "Wrong stage");
        require(
            address(this).balance <= amount,
            "Can't send more than specified amount"
        );

        if (address(this).balance >= amount) {
            currentStage = Stages.LOCKED;
            emit stageChange(currentStage);
        }
        emit deposited(amount, currentStage);
    }

    function release() public {
        require(msg.sender == agent, "Only agent can release funds");
        require(currentStage == Stages.LOCKED, "Funds not in escrow yet");
        beneficiary.transfer(amount);
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
        depositor.transfer(amount);
        currentStage = Stages.CLOSED;
        emit stageChange(currentStage);
        emit reverted(amount, currentStage);
    }

    function stageOf() public view returns (Stages) {
        return currentStage;
    }

    function balanceOf() public view returns (uint256) {
        return address(this).balance;
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
        address payable _depositor,
        address payable _beneficiary,
        address _agent,
        uint256 _amount
    ) public returns (uint256) {
        EscrowWithAgent newEscrow = new EscrowWithAgent();
        newEscrow.init(_depositor, _beneficiary, _agent, _amount);

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