export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The (auth) route group shares no visual chrome by default; individual
  // pages opt into <AuthSplitPanel> for the marketing side panel.
  // This layout exists so future shared concerns (toast provider, analytics
  // scoped to the auth funnel, etc.) have a single mount point.
  return children;
}
