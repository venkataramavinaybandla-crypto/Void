export const syllabus = [
  {
    id: 1,
    co: 'CO1',
    code: 'CO1',
    title: 'Cloud Foundations & Virtualization',
    description: 'Foundational cloud computing principles, service models, virtualization primitives, and hypervisor architecture.',
    sessions: [
      { number: 1, title: 'Cloud Computing Fundamentals & Essential Characteristics' },
      { number: 2, title: 'Cloud Service Models: IaaS, PaaS, SaaS & Shared Responsibility' },
      { number: 3, title: 'Virtualization Fundamentals, Hypervisors & VM Architecture' },
      { number: 4, title: 'Container Isolation Primitives & Global Cloud Infrastructure' }
    ]
  },
  {
    id: 2,
    co: 'CO2',
    code: 'CO2',
    title: 'Compute, Scaling & Workload Placement',
    description: 'Compute instance families, autoscaling policies, container orchestration, and serverless runtime placement.',
    sessions: [
      { number: 5, title: 'Compute Instance Families, Sizing & Lifecycle Management' },
      { number: 6, title: 'Container Packaging & Kubernetes Cluster Architecture' },
      { number: 7, title: 'Elasticity, Auto Scaling Dynamics & Policy Tuning' },
      { number: 8, title: 'Serverless Compute, Function Runtimes & Placement Optimization' }
    ]
  },
  {
    id: 3,
    co: 'CO3',
    code: 'CO3',
    title: 'Networking, Connectivity & Content Delivery',
    description: 'Software-defined networking, VPC topologies, transit routing, load balancing, and edge caching delivery.',
    sessions: [
      { number: 9, title: 'Software-Defined Networking, VPCs & Subnet Topologies' },
      { number: 10, title: 'Gateways, Peering, Transit Routing & Hybrid Connectivity' },
      { number: 11, title: 'Traffic Distribution, Layer 4 & Layer 7 Load Balancing' },
      { number: 12, title: 'Edge Infrastructure, Anycast Routing & Content Delivery Networks' }
    ]
  },
  {
    id: 4,
    co: 'CO4',
    code: 'CO4',
    title: 'Storage, Data Services & Disaster Recovery',
    description: 'Distributed storage tiers, relational and NoSQL engines, consistency models, and disaster recovery.',
    sessions: [
      { number: 13, title: 'Block Storage Volumes, Local NVMe & Performance Characteristics' },
      { number: 14, title: 'Object Storage Architecture, Data Lifecycle & Immutability' },
      { number: 15, title: 'Managed Relational & Distributed NoSQL Database Systems' },
      { number: 16, title: 'Replication Semantics, Disaster Recovery & RPO/RTO Strategies' }
    ]
  },
  {
    id: 5,
    co: 'CO5',
    code: 'CO5',
    title: 'Identity, Security, Compliance & Observability',
    description: 'Identity governance, encryption, zero trust network perimeters, and unified cloud observability.',
    sessions: [
      { number: 17, title: 'Identity & Access Management, RBAC & Least-Privilege Policies' },
      { number: 18, title: 'Cryptographic Key Management, Envelope Encryption & Secrets' },
      { number: 19, title: 'Perimeter Defense, Cloud Firewalls & Zero Trust Architecture' },
      { number: 20, title: 'Telemetry Pipelines: Metrics, Distributed Tracing & Centralized Logging' }
    ]
  },
  {
    id: 6,
    co: 'CO6',
    code: 'CO6',
    title: 'IaC, Delivery, Operations & Cost Engineering',
    description: 'Declarative IaC automation, deployment pipelines, FinOps unit economics, and operational reliability.',
    sessions: [
      { number: 21, title: 'Declarative Infrastructure as Code & State Drift Management' },
      { number: 22, title: 'CI/CD Pipelines, Immutable Releases & Canary Rollouts' },
      { number: 23, title: 'Cloud Cost Engineering, Billing Allocation & FinOps Strategies' },
      { number: 24, title: 'Site Reliability Engineering, Chaos Engineering & Incident Operations' }
    ]
  }
];

