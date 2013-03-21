mongoimport -d BilancioNode -c operations --file import.json --jsonArray --drop

db.operations.aggregate({
	$project : {
		categories : 1
	}
}, {
	$unwind : "$categories"
});

db.operations.aggregate({
	$project : {
		categories : 1
	}
});

//GroupBy Categories
db.operations.aggregate(
	{ $match : {
		date : { $gte : new Date(2012, 0, 1), $lte : new Date(2012, 11, 31)}}},
	{ $project : {
		categories : 1,
		amountIn : 1,
		amountOut : 1,
		date : 1 }}, 
	{ $group : {
			_id : "$categories",
			date : { $min : "$date" },
			size : { $sum : 1 },
			amountIn : { $sum : "$amountIn" },
			amountOut : { $sum : "$amountOut"} } }
)

//GroupBy Date
db.operations.aggregate(
	{ $match : {
		date : { $gte : new Date(2012, 0, 1), $lte : new Date(2012, 11, 31)}}},
	{ $project : {
		categories : 1,
		amountIn : 1,
		amountOut : 1,
		date : 1 }}, 
	{ $group : {
			_id : "$date",
			categories:{ $addToSet : "$categories" },
			size : { $sum : 1 },
			amountIn : { $sum : "$amountIn" },
			amountOut : { $sum : "$amountOut"} } }
)

//GroupBy Date(year, month)
db.operations.aggregate(

	{ $match : {
		date : { $gte : new Date(2012, 0, 1), $lte : new Date(2012, 11, 31)}}},

	{ $project : {
		categories : 1,
		amountIn : 1,
		amountOut : 1,
		dday : { $dayOfMonth : "$date"},
		dmonth : { $month : "$date"},
		dyear : { $year : "$date"},
		}}, 
	{ $group : {
			_id : {y:"$dyear", m:"$dmonth"},
			categories:{ $addToSet : "$categories" },
			size : { $sum : 1 },
			amountIn : { $sum : "$amountIn" },
			amountOut : { $sum : "$amountOut"} } }
)

//Type Conversion
db.operations.find().forEach(function (x) {
	/*string to number*/
	x.amountIn = Number(x.amountIn.replace(",", "."));
	x.amountOut = Number(x.amountOut.replace(",", "."));
	db.operations.save(x);
})
db.operations.find().forEach(function (x) {
	/*string to date, month is 0-based in JS*/
	var d = x.date.split("/");
	var t = x.dateTransition.split("/");
	x.date = new Date(d[2], Number(d[1]) - 1, d[0],0,0,0,0);
	x.dateTransition = new Date(t[2], Number(t[1]) - 1, t[0],0,0,0,0);
	db.operations.save(x);
})
