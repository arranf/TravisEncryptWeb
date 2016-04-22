function getEncryptedVar(){
    $('#fields').prop('disabled', true);
    $('#submit').text('Fetching...');
    $('#submit').prop('disabled', true);
    var github_regex = new RegExp('([A-za-z0-9_-]{1,39})(?:\/)([A-za-z0-9_-]*)');
    var input_regex = new RegExp('[\S]*\=\S*');
    var github = $('#github-url').val();
    var input = $('#variable').val();
    if ( github_regex.test(github) === true && input_regex.test(input) ) {
        $('#invalid').hide();
        var org = github.match(github_regex)[1];
        var repository = github.match(github_regex)[2];
        travisRequest(org,repository,input);
    }
    else {
        show('#invalid');
        reset();
    }
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
        console.log( data );
        console.log(data.key);
        encrypt(toencrypt,data.key);
      })
      .fail(function(data) {
        console.log( "Error" );
      })
      .always(function (data) {
        console.log( "Complete" );
        reset();
      });
}

function encrypt(input, publicKey){
    var encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    var encrypted = encrypt.encrypt(input);
    console.log(encrypted);
    insertResult(encrypted);
}

function insertResult(encrypted){
    var result = "<div class='panel panel-default' id='result-"+$('#counter').val()+"'><div class='panel-heading' id='result-heading'>"+$('#variable').val()+"</div><div class='panel-body'><pre id='result-content'> - secure: "+encrypted+"</pre></div></div>";
    $('#counter').val( function(i, oldval) {
    return ++oldval;
    });
    $('#results').append(result);
}
