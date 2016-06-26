function getEncryptedVar(){
    debugger;
    $('#fields').prop('disabled', true);
    $('#submit').text('Fetching...');
    $('#submit').prop('disabled', true);
    var github_regex = new RegExp('([A-za-z0-9_-]{1,39})(?:\/)([A-za-z0-9_\-\.]*)');
    var input_regex = new RegExp('[\S]*\=\S*');
    var github = $('#github-url').val();
    var input = $('#variable').val();
    if (github === '' || github === null || input === '' || input === null){
        $('#invalid-info').text('You have not completed all of the fields.');
        show('#invalid');
    }
    else if ( github_regex.test(github) === true && input_regex.test(input) ) {
        $('#invalid').hide();
        var org = github.match(github_regex)[1];
        var repository = github.match(github_regex)[2];
        console.log(org);
        console.log(repository);
        travisRequest(org,repository,input);
    }
    else {
        $('#invalid-info').text("You've entered an invalid input. Please try again.");
        show('#invalid');
    }
    reset();
}

function reset(){
    $('#fields').prop('disabled', false);
    $('#submit').text('Encrypt');
    $('#submit').prop('disabled', false);
}

function show(element){
    if ($(element).hasClass('hidden')){
        $(element).removeClass('hidden');
    }
    $(element).show();
}

function travisRequest(org, repo, toencrypt){
    var url = 'https://api.travis-ci.org/repos/'+org+'/'+repo+'/key';
    var request = $.getJSON( url)
      .done(function(data) {
        encrypt(toencrypt,data.key);
      })
      .fail(function(data) {
          $('#invalid-info').text("There was an error accessing the public-key for the repository information you entered. Is it setup on Travis?");
          show('#invalid');
        console.log( "Error" );
      })
      .always(function (data) {
        console.log( "Complete" );
      });
}

function encrypt(input, publicKey){
    var encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    var encrypted = encrypt.encrypt(input);
    insertResult(encrypted);
    if(inputsHaveDuplicateValues()){
        show('#dupe-warn');
    }
}

function insertResult(encrypted){
    var result = "<div class='panel panel-default' id='result-"+$('#counter').val()+"'><div class='panel-heading' id='result-heading-"+$('#counter').val()+"'>"+$('#variable').val()+"</div><div class='panel-body'><pre id='result-content'> - secure: "+encrypted+"</pre></div></div>";
    $('#counter').val( function(i, oldval) {
    return ++oldval;
    });
    $('#results').append(result);
}

function inputsHaveDuplicateValues() {
  var hasDuplicates = false;
  $("[id|=result-heading]").each(function () {
    var current = $(this).text();
    var inputsWithSameValue = 0;
    $("[id|=result-heading]").each(function () {
        if ($(this).text() === current){
            inputsWithSameValue++;
        }
        if (inputsWithSameValue > 1){
            return;
        }
    });
    hasDuplicates = inputsWithSameValue > 1;
    //This will break out of the each loop if duplicates have been found.
    return hasDuplicates;
  });
  return hasDuplicates;
}
