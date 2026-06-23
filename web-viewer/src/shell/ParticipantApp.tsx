import { useRoute } from './router'
import { NavShell } from './NavShell'
import { CatalogueView } from '../home/CatalogueView'
import { MyDataView } from '../mydata/MyDataView'
import { AccountView } from '../account/AccountView'

export function ParticipantApp() {
  const route = useRoute()
  const view = route === '/my-data' ? <MyDataView /> : route === '/account' ? <AccountView /> : <CatalogueView />
  return <NavShell>{view}</NavShell>
}
