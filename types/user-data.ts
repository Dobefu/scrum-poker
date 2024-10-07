export type UserData = Record<
  string,
  {
    user: {
      id: number
      name: string
    }
    estimate?: string
  }
>
