import { ResourceManager } from '@/components/admin/resource-manager';

export default function Page() {
  return (
    <ResourceManager
      resource="housing-parameters"
      idKey="key"
      title="Housing parameters"
    />
  );
}
