interface Props {
  title?: string
  message?: string
  onReset?: () => void
}

export function ErrorFallback({
  title = 'Something went wrong',
  message = 'An unexpected error occurred.',
  onReset,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
      <p className="font-semibold text-red-700 dark:text-red-400">{title}</p>
      <p className="text-sm text-red-600 dark:text-red-500">{message}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}
