function start(){
    disable();
    var github_regex = new RegExp('([A-za-z0-9_-]{1,39})(?:\/)([A-za-z0-9_\\-\\.]*)');
    var github = $('#github-url').val();
    if (github_regex.test(github) === false) {
        $('#invalid-info').text("You've entered an invalid input. Please try again.");
        show('#invalid');
        reset();
        return false;
    }        
    $('#invalid').hide();
    var org = github.match(github_regex)[1];
    var repository = github.match(github_regex)[2];

    if ( $('li.active').attr('id') === 'tab-variable' ){
        getEncryptedVar(org, repository);
    }
    else if( $('li.active').attr('id') === 'tab-file' ) {
        getEncryptedFile(org, repository);
    }
    reset();
}

function getEncryptedVar(org, repository)
{    
    var input_regex = new RegExp('[\S]*\=\S*');
    
    var input = $('#variable').val();
    if (input === '' || input === null) {
        $('#invalid-info').text('You have not completed all of the fields.');
        show('#invalid');
    }
    else if (input_regex.test(input) === true) {
        $('#invalid').hide();
        travisRequest(org, repository, input, 'variable');
    }
    else {
        $('#invalid-info').text("You've entered an invalid input. Please try again.");
        show('#invalid');
    }
}

function getEncryptedFile(org, repository)
{
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
        if (document.getElementById('input-file').files[0] != null) {
            travisRequest(org, repository, "", file);
        }
        else {
            show('#invalid');
        }
    }
    else {
        show('#file-unsupported');
    }
}

function disable()
{
    $('.field-container').prop('disabled', true);
    $("li[data-role='presentation']").addClass('disabled');
    $('#submit-variable').text('Fetching...');
    $('#submit-variable').prop('disabled', true);
    /*disable non active tabs*/
    $('.nav li').not('.active').addClass('disabled');
    /*to actually disable clicking the bootstrap tab, as noticed in comments by user3067524*/
    $('.nav li').not('.active').find('a').removeAttr("data-toggle");
}

function reset(){
    $('.field-container').prop('disabled', false);
    $('#submit-variable').text('Encrypt');
    $('#submit-variable').prop('disabled', false);
    $('.nav li').not('.active').removeClass('disabled');
    /*to actually disable clicking the bootstrap tab, as noticed in comments by user3067524*/
    $('.nav li').not('.active').find('a').attr("data-toggle", "tab");
}

function travisRequest(org, repo, input, type)
{
    var url = 'https://api.travis-ci.org/repos/' + org + '/' + repo + '/key';
    var request = $.getJSON(url)
      .done(function (data)
      {
          var key = data.key;
          if (type === 'variable') {
              insertResult(encryptVar(input, key), type);
              if (inputsHaveDuplicateValues()) {
                  show('#dupe-warn');
              }
          }
          else {
              encryptFile(key, org, repo);
          }
      })
      .fail(function (data)
      {
          $('#invalid-info').text("There was an error accessing the public-key for the repository information you entered. Is it setup on Travis?");
          show('#invalid');
          console.log("Error");
      })
      .always(function (data)
      {
          console.log("Complete");
      });
}

function show(element){
    if ($(element).hasClass('hidden')){
        $(element).removeClass('hidden');
    }
    $(element).show();
}

function encryptVar(input, publicKey)
{
    var key = forge.pki.publicKeyFromPem(publicKey);
    var encrypted = key.encrypt(input);
    return btoa(encrypted);
}

function insertResult(encrypted, type)
{
    var title = '';
    if (type === 'variable') {
        title = $('#variable').val();
    }
    else {
        title = escape(document.getElementById('input-file').files[0].name);
    }
    var result = "<div class='panel panel-default' id='result-"+$('#counter').val()+"'><div class='panel-heading' id='result-heading-"+$('#counter').val()+"'>"+title+"</div><div class='panel-body'><pre id='result-content'> - secure: "+encrypted+"</pre></div></div>";
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

function getGithubOrg()
{
    return $('#github-url').val().match(github_regex)[1];
}

function getGithubRepo()
{
    return repository = $('#github-url').val().match(github_regex)[2];
}



//http://stackoverflow.com/questions/25354313/saving-a-uint8array-to-a-binary-file

//https://github.com/digitalbazaar/forge/issues/200
function str2ab_3(str)
{
    var length = str.length;
    var buff = new ArrayBuffer(length);
    var buffView = new Uint8Array(buff);
    for (var i = 0; i < length; i += 65535) {
        var addition = (i + 65535 > length) ? length - i : 65535;
        // slice and map are native functions 
        buffView.set(str.slice(i, i + addition).split('').map(function (el) { return el.charCodeAt(); }));
    }
    return buff;
}
function encryptFile(rsaPublicKey, org, repo)
{
    var salt = forge.random.getBytesSync(256);
    var iv = forge.random.getBytesSync(16);
    var aesKey = forge.random.getBytesSync(32)
    var password = 'SECRET_KEY=' + forge.util.encode64(aesKey);
    var encryptedVariable = encryptVar(password, rsaPublicKey);
    var cipher = forge.cipher.createCipher('AES-CBC', aesKey);
    var file = document.getElementById('input-file').files[0];
    var reader = new FileReader();
    var read = reader.readAsArrayBuffer(file);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(read));
    cipher.finish();
    var encryptedData = str2ab_3(cipher.output.getBytes());
    var blob = new Blob([encryptedData], { type: 'application/octet-binary' });
    saveAs(blob, file.name + ".enc");
    insertResult(forge.util.encode64(aesKey), 'file');
}
