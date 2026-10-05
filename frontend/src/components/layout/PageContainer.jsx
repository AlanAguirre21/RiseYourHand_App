const WIDTHS = {
  md: 'max-w-md',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function PageContainer({ size = 'md', children }) {
  return (
    <div className={`mx-auto w-full ${WIDTHS[size]} px-4 py-8 sm:py-12`}>
      {children}
    </div>
  );
}