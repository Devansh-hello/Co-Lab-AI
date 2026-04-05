import Benchmarks from "../../screens/Benchmarks";
import { ProtectedPage } from "../../components/ProtectedPage";

export default function BenchmarksPage() {
  return (
    <ProtectedPage>
      <Benchmarks />
    </ProtectedPage>
  );
}
