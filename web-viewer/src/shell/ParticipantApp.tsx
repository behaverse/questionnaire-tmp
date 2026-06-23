import { useRoute } from './router'
import { NavShell } from './NavShell'
import { CatalogueView } from '../home/CatalogueView'
import { MyDataView } from '../mydata/MyDataView'
import { AccountView } from '../account/AccountView'
import { ResetPasswordView } from '../account/ResetPasswordView'
import { VerifyEmailView } from '../account/VerifyEmailView'

export function ParticipantApp() {
  const route = useRoute()
  const view =
    route === '/my-data' ? <MyDataView />
    : route === '/account' ? <AccountView />
    : route === '/reset-password' ? <ResetPasswordView />
    : route === '/verify-email' ? <VerifyEmailView />
    : <CatalogueView />
  return <NavShell>{view}</NavShell>
}
