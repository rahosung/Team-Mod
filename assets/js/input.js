$(document).ready(function() {
    $('.im').css('display', 'none');
    //$(".search").on("propertychange change paste input", function() {
    $("#search_button").on('click', function(event){
        var Value = $("#search").val();
        console.log(Value)
        if (!Value){
            console.log("none")
            $('.im').css('display', 'none');
        }else{
            console.log("vis")
            $('.im').css('display', '');
        }
    });
});