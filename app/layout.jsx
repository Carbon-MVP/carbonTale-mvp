export const metadata = {
  title: 'CarbonTale MVP',
  description: 'Carbon emissions calculator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
