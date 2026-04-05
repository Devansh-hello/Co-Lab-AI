import Projects from "../../screens/Projects";
import { ProtectedPage } from "../../components/ProtectedPage";

export default function ProjectsPage() {
  return (
    <ProtectedPage>
      <Projects />
    </ProtectedPage>
  );
}
