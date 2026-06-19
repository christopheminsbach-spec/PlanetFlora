navigator.geolocation.getCurrentPosition(
  (position) => {

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log(latitude, longitude);

  },
  (error) => {
    console.log(error);
  }
);