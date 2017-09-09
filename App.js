import React, { Component } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { Constants, Location, Permissions } from 'expo';

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      data: {
        temp_c: null
      },
      error: '',
      weatherLoading: 'loading',
      location: {
        coords: {
          latitude: null,
          longitude: null,
        },
        country: '',
        city: ''
      },
      interval: null
    };
  }
  /* get weather data from weatherunlocked */
  getWeather() {
    if (this.state.location.coords.latitude !== null && this.state.location.coords.longitude !== null) {
      const latitude = this.state.location.coords.latitude.toFixed(3);
      const longitude = this.state.location.coords.longitude.toFixed(3);

      const url =
        'http://api.weatherunlocked.com/api/current/' +
        latitude +
        ',' +
        longitude +
        '?app_id=609dc9e9&app_key=010a976c2b5d90d64f7fea3511fceba4';

      const options = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      fetch(url, options)
        .then(response => {
          if (response.ok) {
            response.json().then(data => {
              this.setState({
                data: data,
                icon: 'http://www.weatherunlocked.com/Images/icons/2/' +
                data.wx_icon.replace('gif', 'png'), // replace gif with gif for better images
              });
            });
          } else {
            this.setState({ error: 'Failed to get location' });
          }
        })
        .catch(err => {
          this.setState({ error: err.message });
        });
    } else {
      this.setState({ error: 'Failed to get location' });
    }
  }

  // set interval for polling data
  setIntervalUpdates(time) {
    const interval = setInterval(() => {
      this.getWeather();
    }, time);
    this.setState({ interval: interval });
  }

  // remove interval updates
  clearIntervalUpdates() {
    clearInterval(this.state.interval);
  }

  // get location and set auto updates
  componentDidMount() {
    this.getLocation();
    this.setIntervalUpdates(3000);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.location !== this.state.location) {
      this.getWeather();
    }
  }

  // clear interval on unmount
  componentWillUnmount() {
    this.clearIntervalUpdates();
  }

  // render temp only on change
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.data.temp_c !== nextState.data.temp_c) {
      return true;
    }
  }

  // get location data
  getLocation = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        error: 'Permission to access location was denied ',
      });
    }
    let location = await Location.getCurrentPositionAsync({});

    const url =
      'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=en&latlng=' +
      location.coords.latitude.toFixed(5) +
      ',' +
      location.coords.longitude.toFixed(5);

    fetch(url)
      .then(response => {
        if (response.ok) {
          response.json().then(data => {
            if (data.results[0]) {
              let city = false, country = false;
              for (let i = 0; i < data.results.length; i++) {
                if (
                  (!city || !country) &&
                  data.results[i].types[0] === 'locality'
                ) {
                  (city =
                    data.results[i].address_components[0]
                      .short_name), (country =
                    data.results[i].address_components[2].long_name);
                  location.country = country;
                  location.city = city;
                }
              }
            }

            this.setState({ location: location });
          });
        } else {
          this.setState({ error: 'Failed to get location' });
        }
      })
      .catch(err => this.setState({ error: err.message }));
  };

  // redner weather function
  renderWeather() {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{this.state.error}</Text>
        <View style={styles.headline}>
          <Text style={styles.city}>{this.state.location.city}</Text>
          <Text style={styles.country}>{this.state.location.country}</Text>
        </View>
        <View style={styles.temperature}>
          <Image
            source={{
              uri: this.state.icon,
            }}
            style={{ width: 150, height: 150 }}
          />
        </View>
        <View>
          <Text style={styles.degree}>{this.state.data.temp_c}</Text>
        </View>
      </View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        {this.renderWeather()}
      </View>
    );
  }
}


// styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    //justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  headline: {
    margin: 44,
  },
  country: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
  city: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
  degree: {
    fontSize: 50,
    fontWeight: 'normal',
    textAlign: 'center',
    color: '#34495e',
  },
  error: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#D10000',
  }
});
