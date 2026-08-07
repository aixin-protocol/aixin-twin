// SPDX-License-Identifier: MIT
// Minimal ERC-8004 "Trustless Agents" registries for BSC Testnet.
// Deploy each contract separately in Remix, then paste the 3 addresses into
// ERC8004_IDENTITY_ADDRESS, ERC8004_REPUTATION_ADDRESS, ERC8004_VALIDATION_ADDRESS.
pragma solidity ^0.8.20;

// ---------------------------------------------------------------------------
// Identity Registry
// ---------------------------------------------------------------------------
contract AiXinIdentityRegistry {
    struct Agent {
        string domain;
        address addr;
        uint256 registeredAt;
    }

    uint256 public nextAgentId = 1;
    mapping(uint256 => Agent) public agents;

    event AgentRegistered(uint256 indexed agentId, string agentDomain, address indexed agentAddress);
    event AgentUpdated(uint256 indexed agentId, string agentDomain, address indexed agentAddress);

    function newAgent(string calldata agentDomain, address agentAddress) external returns (uint256 agentId) {
        agentId = nextAgentId++;
        agents[agentId] = Agent({ domain: agentDomain, addr: agentAddress, registeredAt: block.timestamp });
        emit AgentRegistered(agentId, agentDomain, agentAddress);
    }

    function updateAgent(uint256 agentId, string calldata agentDomain, address agentAddress) external {
        require(agents[agentId].addr == msg.sender, "not owner");
        agents[agentId].domain = agentDomain;
        agents[agentId].addr = agentAddress;
        emit AgentUpdated(agentId, agentDomain, agentAddress);
    }

    function getAgent(uint256 agentId) external view returns (string memory, address, uint256) {
        Agent memory a = agents[agentId];
        return (a.domain, a.addr, a.registeredAt);
    }
}

// ---------------------------------------------------------------------------
// Reputation Registry
// ---------------------------------------------------------------------------
contract AiXinReputationRegistry {
    event FeedbackGiven(
        address indexed client,
        uint256 indexed agentServerId,
        uint8 score,
        bytes32 dataHash,
        string dataURI
    );

    function giveFeedback(
        uint256 agentServerId,
        uint8 score,
        bytes32 dataHash,
        string calldata dataURI
    ) external {
        require(score <= 100, "score>100");
        emit FeedbackGiven(msg.sender, agentServerId, score, dataHash, dataURI);
    }
}

// ---------------------------------------------------------------------------
// Validation Registry
// ---------------------------------------------------------------------------
contract AiXinValidationRegistry {
    event ValidationRequest(
        address indexed requester,
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 dataHash
    );
    event ValidationResponse(
        address indexed responder,
        bytes32 indexed dataHash,
        uint8 response
    );

    function validationRequest(
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash
    ) external {
        emit ValidationRequest(msg.sender, agentValidatorId, agentServerId, dataHash);
    }

    function validationResponse(bytes32 dataHash, uint8 response) external {
        require(response <= 100, "response>100");
        emit ValidationResponse(msg.sender, dataHash, response);
    }
}
