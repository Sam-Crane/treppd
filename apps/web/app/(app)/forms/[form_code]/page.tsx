import { FormGuide } from '@/components/forms/form-guide';
import { AutofillPanel } from '@/components/forms/autofill-panel';

export const metadata = {
  title: 'Form Guide — Treppd',
};

export default async function FormGuidePage({
  params,
}: {
  params: Promise<{ form_code: string }>;
}) {
  const { form_code } = await params;
  return (
    <div className="space-y-6">
      <AutofillPanel formCode={form_code} />
      <FormGuide formCode={form_code} />
    </div>
  );
}
