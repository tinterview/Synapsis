import { useAuth0 } from "@auth0/auth0-react";

import React from 'react'


const LogoutButton = () => {
  const { logout, isAuthenticated } = useAuth0()
  return (
      <button onClick={() => logout()}>
        Sign in
      </button>
    )

}

export default LogoutButton