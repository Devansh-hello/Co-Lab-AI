import TestProjects from "../../screens/TestProjects";
import { ProtectedPage } from "../../components/ProtectedPage";

export default function TestProjectsPage() {
  return (
    <ProtectedPage>
      <TestProjects />
    </ProtectedPage>
  );
}
