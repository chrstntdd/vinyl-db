$(() => {
  // document ready functions
  handleSearch();
});

window.state = {

}

const handleSearch = () => {
  $('#search-form').on('submit', (e) => {
    e.preventDefault();
    let searchRequest = {
      artist: $('#search-artist').val(),
      album: $('#search-album').val()
    }
    callDiscogsAPI(JSON.stringify(searchRequest));
  });
}


const callDiscogsAPI = (searchRequest) => {
  const request = $.ajax({
    type: 'POST',
    url: '/search',
    processData: false,
    data: searchRequest,
    contentType: 'application/json'
  });
  request.done((data) => {
    console.log(data);
  });
  request.fail((jqXHR, textStatus) => {
    console.error(`Request Failed: ${textStatus}`);
  });
}