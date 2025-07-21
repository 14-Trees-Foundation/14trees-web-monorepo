import { AutoPrsReqPlotsRepository } from "../repo/autoPrsReqPlotRepo";
import { PlotRepository } from "../repo/plotRepo";
import { GoogleSpreadsheet } from "../services/google";

async function getDonationInventoryStates() {
    const autoPrsDonPlots = await AutoPrsReqPlotsRepository.getPlots('donation');

    const plotIds = autoPrsDonPlots.map(item => item.plot_id);
    const plotsResp = await PlotRepository.getPlots(0, plotIds.length, [{ columnField: 'id', operatorValue: 'isAnyOf', value: plotIds }]);

    const data = plotsResp.results.map((plot: any) => {
        return [plot.name, plot.site_name, plot.total, plot.booked_trees, plot.available_trees]
    })

    return data;
}

async function getGiftInventoryStates() {
    const autoPrsDonPlots = await AutoPrsReqPlotsRepository.getPlots('donation');

    const plotIds = autoPrsDonPlots.map(item => item.plot_id);
    const plotsResp = await PlotRepository.getPlots(0, plotIds.length, [{ columnField: 'id', operatorValue: 'isAnyOf', value: plotIds }]);

    const data = plotsResp.results.map((plot: any) => {
        return [plot.name, plot.site_name, plot.total, plot.booked_trees, plot.available_trees, plot.card_available_trees]
    })

    return data;
}

export async function updateInventoryStates() {

    const spreadsheetId = process.env.AP_INVENTORY_SPREADSHEET;
    if (!spreadsheetId) {
        console.log("[ERROR]", "AutoProcessInventory::updateInventoryStates", "Spreadsheet id not found in env file");
        return;
    }
    
    try {
        const spreadsheet = new GoogleSpreadsheet();
        const date = new Date().toISOString().split('T')[0];

        const donationSheetName = 'Donations';
        let donationRows = await getDonationInventoryStates();
        donationRows = donationRows.map(row => [...row, date]);
        await spreadsheet.insertRowsData(spreadsheetId, donationSheetName, donationRows);

        const giftSheetName = 'Gift Requests';
        let giftRows = await getGiftInventoryStates();
        giftRows = giftRows.map(row => [...row, date]);
        await spreadsheet.insertRowsData(spreadsheetId, giftSheetName, giftRows);
    } catch (error) {
        console.log("[ERROR]", "AutoProcessInventory::updateInventoryStates", "Google credentials not configured for local development:", error.message);
        return;
    }
}