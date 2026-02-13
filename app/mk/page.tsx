import HelpDeskForm from '../components/HelpDeskForm'
import { fetchMasterData } from '../actions'

export default async function MKPage() {
    const data = await fetchMasterData();
    return <HelpDeskForm
        type="MK"
        themeColor="blue"
        masterData={data.mk}
        resolvers={data.resolvers}
        caseErrors={data.caseErrors}
        symptoms={data.symptoms}
        solutions={data.solutions}
    />
}
