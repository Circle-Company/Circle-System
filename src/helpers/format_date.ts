export function formatDate(dateString) {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleString('en-US', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '');
    return formattedDate;
}
