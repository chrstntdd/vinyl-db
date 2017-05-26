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
  $.ajax({
    type: 'POST',
    url: '/search',
    processData: false,
    data: searchRequest,
    contentType: 'application/json'
  }).done((data) => {
    console.log(data);
  });
}