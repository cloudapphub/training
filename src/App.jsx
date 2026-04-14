import { Routes, Route } from 'react-router-dom'
import TrainingHome from './TrainingHome'
import PythonOneDay from './PythonOneDay'
import PromptEngineeringDay from './PromptEngineeringDay'
import TerraformOneDay from './TerraformOneDay'
import MigrationEKS from './MigrationEKS'
import SpringBootEKS from './SpringBootEKS'
import TerraformHCL from './TerraformHCL'
import GenAILLM from './GenAILLM'
import EksManagedNodes from './EksManagedNodes'
import HsmSwiftTraining from './HsmSwiftTraining'
import LangGraphTraining from './LangGraphTraining'
import AgenticCommerceTraining from './AgenticCommerceTraining'
import ReactTraining from './ReactTraining'
import JavaTraining from './JavaTraining'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrainingHome />} />
      <Route path="/python-one-day" element={<PythonOneDay />} />
      <Route path="/prompt-engineering" element={<PromptEngineeringDay />} />
      <Route path="/terraform-one-day" element={<TerraformOneDay />} />
      <Route path="/migration-eks" element={<MigrationEKS />} />
      <Route path="/springboot-eks-aurora" element={<SpringBootEKS />} />
      <Route path="/terraform-hcl" element={<TerraformHCL />} />
      <Route path="/genai-llm" element={<GenAILLM />} />
      <Route path="/eks-managed-nodes" element={<EksManagedNodes />} />
      <Route path="/hsm-swift" element={<HsmSwiftTraining />} />
      <Route path="/langgraph" element={<LangGraphTraining />} />
      <Route path="/agentic-commerce" element={<AgenticCommerceTraining />} />
      <Route path="/react" element={<ReactTraining />} />
      <Route path="/core-java" element={<JavaTraining />} />
    </Routes>
  )
}
