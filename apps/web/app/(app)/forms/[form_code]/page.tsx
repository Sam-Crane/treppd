import { FormGuide } from '@/components/forms/form-guide';

export const metadata = {
  title: 'Form Guide — Treppd',
};

export default async function FormGuidePage({
  params,
}: {
  params: Promise<{ form_code: string }>;
}) {
  const { form_code } = await params;
  return <FormGuide formCode={form_code} />;
}
