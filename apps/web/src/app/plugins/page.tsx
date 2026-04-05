import Plugins from "../../screens/Plugins";
import { ProtectedPage } from "../../components/ProtectedPage";

export default function PluginsPage() {
  return (
    <ProtectedPage>
      <Plugins />
    </ProtectedPage>
  );
}
