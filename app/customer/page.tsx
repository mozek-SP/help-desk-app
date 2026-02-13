import HelpDeskForm from '../components/HelpDeskForm'
import { fetchMasterData } from '../actions'

export default async function CustomerPage() {
    const data = await fetchMasterData();
    return <HelpDeskForm
        type="ลูกค้าทั่วไป"
        themeColor="rose"
        masterData={data.customer}
        resolvers={data.resolvers}
        caseErrors={data.caseErrors}
        symptoms={data.symptoms}
        solutions={data.solutions}
    />
}
