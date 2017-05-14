$('#upload').on('change', () => {
  getFileURL();
});

let imgUrl;

const getFileURL = () => {
  var file = document.getElementById('upload').files[0];
  var reader = new FileReader();
  
  reader.readAsDataURL(file);

  reader.onloadend = () => {
    imgUrl = reader.result;
    // console.log(imgUrl);
    gapi.load('client', initGoogleImageSearch);
  }
}

const initGoogleImageSearch = () => {
  gapi.client.init({
    apiKey: 'AIzaSyCkza6KueTNrnNOfWHXJLaHWdR6_hgzl7E',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/customsearch/v1/rest'],
  })
  .then(() => {
    return gapi.client.search.cse.list({
      q: imgUrl,
      cx: '005474769488126929950:2kswgarcnca',
      key: 'AIzaSyCkza6KueTNrnNOfWHXJLaHWdR6_hgzl7E',
      searchType: 'image'
    });
  })
  .then(response => {
    console.log(response);
  })
}

