const { ScamAnalysisTool } = require('../dist/index');

/**
 * Demonstration of the new analyzeContractAdvanced method
 * This shows the comprehensive analysis capabilities including:
 * - Bytecode analysis
 * - Pattern detection 
 * - Risk scoring
 * - Security warnings
 */

async function demonstrateAdvancedAnalysis() {
  console.log('🔍 Shuffle.com Airdrop Scam Analysis Tool - Advanced Analysis Demo\n');
  
  const tool = new ScamAnalysisTool();
  
  // Example 1: Known malicious address
  console.log('📊 Example 1: Analyzing known malicious contract');
  console.log('=' * 50);
  
  try {
    const maliciousAddress = '0xacba164135904dc63c5418b57ff87efd341d7c80';
    const result = await tool.analyzeContractAdvanced(maliciousAddress);
    
    console.log(`Contract: ${result.contractAddress}`);
    console.log(`Risk Level: ${result.riskLevel.toUpperCase()}`);
    console.log(`Analysis Status: ${result.analysisStatus}`);
    console.log(`Vulnerabilities Found: ${result.vulnerabilities.length}`);
    
    if (result.securityWarnings && result.securityWarnings.length > 0) {
      console.log('\n⚠️  Security Warnings:');
      result.securityWarnings.forEach(warning => {
        console.log(`  - [${warning.level.toUpperCase()}] ${warning.message}`);
      });
    }
    
    if (result.riskAssessment) {
      console.log('\n📈 Risk Assessment:');
      console.log(`  - Risk Score: ${Math.round(result.riskAssessment.riskScore * 100)}%`);
      console.log(`  - Confidence: ${Math.round(result.riskAssessment.confidence * 100)}%`);
      console.log(`  - Summary: ${result.riskAssessment.explanation.summary}`);
    }
    
    if (result.bytecode) {
      console.log('\n🔧 Bytecode Analysis:');
      console.log(`  - Bytecode Size: ${result.bytecodeSize} bytes`);
      console.log(`  - Is Contract: ${result.isContract}`);
      console.log(`  - Is Proxy: ${result.isProxyContract}`);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing malicious contract:', error.message);
  }
  
  console.log('\n' + '=' * 50);
  
  // Example 2: Regular Ethereum address (EOA)
  console.log('\n📊 Example 2: Analyzing regular Ethereum address (EOA)');
  console.log('=' * 50);
  
  try {
    const regularAddress = '0x1234567890123456789012345678901234567890';
    const result = await tool.analyzeContractAdvanced(regularAddress);
    
    console.log(`Contract: ${result.contractAddress}`);
    console.log(`Risk Level: ${result.riskLevel.toUpperCase()}`);
    console.log(`Analysis Status: ${result.analysisStatus}`);
    console.log(`Is Contract: ${result.isContract}`);
    
    if (result.vulnerabilities.length > 0) {
      console.log(`\n🔍 Vulnerabilities: ${result.vulnerabilities.join(', ')}`);
    } else {
      console.log('\n✅ No vulnerabilities detected');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing regular address:', error.message);
  }
  
  console.log('\n' + '=' * 50);
  
  // Example 3: Compare basic vs advanced analysis
  console.log('\n📊 Example 3: Comparing Basic vs Advanced Analysis');
  console.log('=' * 50);
  
  const testAddress = '0x1234567890123456789012345678901234567890';
  
  console.log('🔹 Basic Analysis:');
  const basicResult = tool.analyzeContract(testAddress);
  console.log(`  - Valid: ${basicResult.isValid}`);
  console.log(`  - Malicious: ${basicResult.isMalicious}`);
  console.log(`  - Risk Level: ${basicResult.riskLevel}`);
  console.log(`  - Warnings: ${basicResult.warnings.length}`);
  
  console.log('\n🔸 Advanced Analysis:');
  try {
    const advancedResult = await tool.analyzeContractAdvanced(testAddress);
    console.log(`  - Contract Address: ${advancedResult.contractAddress}`);
    console.log(`  - Risk Level: ${advancedResult.riskLevel}`);
    console.log(`  - Analysis Status: ${advancedResult.analysisStatus}`);
    console.log(`  - Vulnerabilities: ${advancedResult.vulnerabilities.length}`);
    console.log(`  - Security Warnings: ${advancedResult.securityWarnings?.length || 0}`);
    console.log(`  - Has Bytecode Analysis: ${!!advancedResult.bytecode}`);
    console.log(`  - Has Pattern Results: ${!!advancedResult.patternResults}`);
    console.log(`  - Has Risk Assessment: ${!!advancedResult.riskAssessment}`);
  } catch (error) {
    console.error('❌ Error in advanced analysis:', error.message);
  }
  
  console.log('\n✨ Advanced analysis provides comprehensive security insights!');
  console.log('📖 Use analyzeContractAdvanced() for full analysis capabilities.');
}

// Run the demonstration
if (require.main === module) {
  demonstrateAdvancedAnalysis()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { demonstrateAdvancedAnalysis };
