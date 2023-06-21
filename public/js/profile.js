$(document).ready(function() {
    // Fetch user details from the server
    $.ajax({
      url: '/userDetails',
      method: 'GET',
      success: function(response) {
        // Update HTML elements with the user details
        $('#username').text(response.username);
        $('#email').text(response.email);
      },
      error: function(error) {
        console.log(error);
      }
    });
  });