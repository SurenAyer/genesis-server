# Genesis-Server

## Overview
Genesis-Server is a scalable and high-performance server designed for managing genotype databases for genebank genomics. Leveraging Apache Cassandra and Express.js, this server efficiently handles large Variant Call Format (VCF) files, providing robust API endpoints for researchers and breeders. The server facilitates the upload, processing, and retrieval of genomic data, ensuring seamless integration into research and breeding workflows.

## Features
- **Highly Scalable Apache Cassandra Database**: Utilizes Apache Cassandra for robust, scalable, and efficient data management.
- **Express.js Framework**: Employs the lightweight and fast Express.js framework for server-side application logic.
- **Chunked Processing of Large VCF Files**: Efficiently processes large VCF files in manageable chunks.
- **10+ REST APIs Implemented**: Includes over 10 RESTful APIs for seamless data interaction, with 4 specific BrAPI endpoints.
- **Swagger for API Documentation**: Provides comprehensive API documentation using Swagger for ease of use and integration.
- **Data Partitioning**: Data is partitioned based on chromosome to enhance query performance and scalability.

## Installation

### Prerequisites
- Node.js and npm
- Apache Cassandra
- Git

### Steps

1. **Clone the repository**
   ```sh
   git clone https://github.com/SurenAyer/genesis-server.git
   cd Genesis-Server
2. **Install dependencies**
   ```sh
   npm Install

3. **Configure Apache Cassandra**
- Install Apache Cassandra from the official website.
- Configure Cassandra as per your environment.
- Create keyspace

4. **Modify db-config.js file**
- Update the db url
- Update keyspace name
  
5. **Start the server**
   ```sh
   npm Start

### Usage
**API Endpoints**
Swagger documentation is available to provide detailed information on each API endpoint.
- Access it at http://localhost:3000/Swagger

### Note
- If remote VCF file is being used, make sure the corresponding tbi file is present at the same location.
- Similarly, if local file is being used a corresponding tbi file needs to be present at the same location i.e, /files folder.

### Contributing
We welcome contributions to enhance the Genesis-Server. 
To contribute, follow these steps:

      1. Fork the repository.
      2. Create a new branch.
      3. Make your changes.
      4. Submit a pull request.

### Contact
For questions or support, please contact the project team at Surendra.Ayer@outlook.com.
