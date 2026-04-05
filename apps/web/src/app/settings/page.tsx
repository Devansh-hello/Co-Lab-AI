import Settings from "../../screens/Settings";
import { ProtectedPage } from "../../components/ProtectedPage";

export default function SettingsPage() {
  return (
    <ProtectedPage>
      <Settings />
    </ProtectedPage>
  );
}
