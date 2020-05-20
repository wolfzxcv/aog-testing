const express = require("express");
const app = express();
const axios = require("axios");
const env = require("./env_config");

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Webhook
app.post("/webhook", async (req, res, next) => {
  console.log("Have entered this webhook!");
  if (!req.body) return res.sendStatus(400);
  console.log("Fetch keyword from dialogflow");
  console.log(req.body);

  try {
    const city = req.body.queryResult.parameters["geo-city"];
    const result =
      (await getWeather(city)) ||
      `Hey, check the city name you wrote, maybe it's a typo!`;
    console.log("Response to dialogflow");

    const toPlatforms = {
      google: {
        expectUserResponse: true,
        richResponse: {
          items: [
            {
              simpleResponse: {
                textToSpeech: result,
              },
            },
          ],
        },
      },
      facebook: {
        text: "Hello, Facebook!",
      },
    };

    const output = {
      payload: toPlatforms,
      fulfillmentText: result,
      speech: result,
      displayText: result,
      source: "",
    };
    return res.json(output);
  } catch (err) {
    console.log("error");
    next(err);
  }
});

// weather API
const getWeather = async (city) => {
  const apiKey = env.API_KEY;
  //API Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit.
  const unit = "Metric";
  let result;
  const api = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;

  try {
    const res = await axios.get(api);
    if (res.data.cod.toString() === "200") {
      result = `It's ${res.data.main.temp} degrees with ${res.data.weather[0].description} in ${res.data.name}`;
    } else if (res.data.cod.toString() !== "200" && res.data.message) {
      result = "Unable to get weather" + res.data.message;
    } else {
      result = "Something went wrong with weather api request!";
    }
    return result;
  } catch (err) {
    console.log(err);
  }
};

// Testing get weather
app.get("/:city", async (req, res, next) => {
  try {
    const result = await getWeather(req.params.city);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
