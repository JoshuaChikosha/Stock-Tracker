// Retrieve tickers from local storage or initialize to an empty array if none found.
var tickers = JSON.parse(localStorage.getItem("tickers")) || [];
var lastPrices = {}; // Object to store the last prices of the tickers.
var counter = 60; // Counter for the update cycle.

function updateCycle() {
  updatePrices();
  var countdown = setInterval(function () {
    counter--; // Decrement the counter every second.
    $("#counter").text(counter);
    if (counter <= 0) {
      updatePrices(); // Update prices when the counter reaches zero.
      counter = 60; // Reset the counter.
    }
  }, 1000); // Set interval to 1 second.
}

$(document).ready(function () {
  // Initial population of tickers on the UI
  tickers.forEach(function (ticker) {
    addTicker(ticker);
  });
  updatePrices(); // Update prices on page load.

  // Event handler for form submission
  $("#add-ticker-form").submit(function (e) {
    e.preventDefault();
    var newTicker = $("#new-ticker").val().toUpperCase().trim();
    if (newTicker === "" || tickers.includes(newTicker)) {
      alert("Please enter a valid Stock symbol that is not already listed.");
      return;
    }

    // AJAX call to validate and add the ticker
    $.ajax({
      url: "/get_data",
      type: "POST",
      data: JSON.stringify({ ticker: newTicker }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        // On successful validation, add the ticker
        tickers.push(newTicker);
        localStorage.setItem("tickers", JSON.stringify(tickers));
        addTicker(newTicker);
        updatePrices();
      },
      error: function (response) {
        if (response.responseJSON && response.responseJSON.error) {
          alert(response.responseJSON.error); // Display the error message
        }
      },
    });

    $("#new-ticker").val(""); // Clear the input field
  });

  // Event handler for removing a ticker
  $("#tickers-grid").on("click", ".remove-btn", function () {
    var tickerToRemove = $(this).data("ticker");
    tickers = tickers.filter((t) => t !== tickerToRemove);
    localStorage.setItem("tickers", JSON.stringify(tickers));
    $("#" + tickerToRemove).remove();
  });

  updateCycle();
});

// Function to add a ticker to the UI.
function addTicker(ticker) {
  // Append a new stock box for the ticker to the tickers grid.
  $("#tickers-grid").append(
    '<div id="' +
      ticker +
      '" class="stock-box"><h2>' +
      ticker +
      '</h2><p id="' +
      ticker +
      '-price"></p><p id="' +
      ticker +
      '-pct"></p><button class="remove-btn" data-ticker="' +
      ticker +
      '">Remove</button></div>'
  );
}

// Function to update the prices of the tickers.
function updatePrices() {
  tickers.forEach(function (ticker) {
    $.ajax({
      url: "/get_data",
      type: "POST",
      data: JSON.stringify({ ticker: ticker }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        var changePercent =
          ((data.currentPrice - data.openPrice) / data.openPrice) * 100; // Calculate the percentage change.
        var colorClass = ""; // Initialize the color class based on change percentage.

        // Determine the color class based on change percentage.
        if (changePercent <= -2) {
          colorClass = "dark-red";
        } else if (changePercent < 0) {
          colorClass = "red";
        } else if (changePercent === 0) {
          colorClass = "gray";
        } else if (changePercent <= 2) {
          colorClass = "green";
        } else {
          colorClass = "dark-green";
        }

        // Update the price and percentage change in the UI.
        $("#" + ticker + "-price").text("$" + data.currentPrice.toFixed(2));
        // Update the color class for price and percentage change.
        $("#" + ticker + "-price, #" + ticker + "-pct")
          .removeClass("dark-red red gray green dark-green")
          .addClass(colorClass);

        var flashClass = "";
        if (lastPrices[ticker] > data.currentPrice) {
          flashClass = "red-flash";
        } else if (lastPrices[ticker] < data.currentPrice) {
          flashClass = "green-flash";
        } else {
          flashClass = "gray-flash";
        }
        lastPrices[ticker] = data.currentPrice;

        $("#" + ticker).addClass(flashClass);
        setTimeout(function () {
          $("#" + ticker).removeClass(flashClass);
        }, 1000);
      },
      error: function (response) {
        if (response.responseJSON && response.responseJSON.error) {
          alert(response.responseJSON.error); // Display the error message

          // Remove the ticker from the UI and the tickers array
          $("#" + ticker).remove();
          tickers = tickers.filter((t) => t !== ticker);

          // Update the tickers in local storage
          localStorage.setItem("tickers", JSON.stringify(tickers));
        }
      },
    });
  });
}
