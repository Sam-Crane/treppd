import { ResourceManager } from '@/components/admin/resource-manager';

export default function Page() {
  return (
    <ResourceManager
      resource="document-requirements"
      idKey="id"
      title="Document requirements"
    />
  );
}
